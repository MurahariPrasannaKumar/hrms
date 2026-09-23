import json
import logging
import os
import re
from urllib.parse import urlencode

import requests
from bs4 import BeautifulSoup
from django.conf import settings
from django.contrib import messages
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils.crypto import get_random_string
from django.utils.translation import gettext_lazy as _

from horilla_views.cbv_methods import login_required, permission_required
from recruitment.models import LinkedInAccount, Recruitment

logger = logging.getLogger(__name__)

LINKEDIN_AUTHORIZATION_URL = "https://www.linkedin.com/oauth/v2/authorization"
LINKEDIN_ACCESS_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
LINKEDIN_USERINFO_URL = "https://www.linkedin.com/oauth/v2/userinfo"
LINKEDIN_OAUTH_SCOPE = "openid profile email w_member_social"


@login_required
@permission_required("recruitment.update_linkedinaccount")
def update_isactive_linkedin(request, obj_id):
    """
    htmx function to update is active field in LinkedInAccount.
    Args:
    - is_active: Boolean value representing the state of LinkedInAccount,
    - obj_id: Id of LinkedInAccount object.
    """
    is_active = request.POST.get("is_active")
    linkedin_account = LinkedInAccount.objects.get(id=obj_id)
    if is_active == "on":
        linkedin_account.is_active = True
        messages.success(request, _("LinkedIn Account activated successfully."))
    else:
        linkedin_account.is_active = False
        messages.success(request, _("LinkedIn Account deactivated successfully."))
    linkedin_account.save()

    return HttpResponse("<script>$('#reloadMessagesButton').click();</script>")


@login_required
@permission_required("recruitment.delete_linkedinaccount")
def delete_linkedin_account(request, pk, return_redirect=True):
    """
    Delete Linkedin account
    """
    try:
        if return_redirect:
            LinkedInAccount.objects.get(id=pk).delete()
            messages.success(request, "Linkedin data deleted")
            return redirect(reverse("linkedin-setting-list"))
    except Exception as e:
        logger(e)
        messages.error(request, "Something went wrong")


@login_required
@permission_required("recruitment.add_linkedinaccount")
def authorize_linkedin(request):
    """
    Starts the LinkedIn OAuth flow: redirects the admin to LinkedIn's
    consent screen so they can authorize this app instead of manually
    pasting an access token.
    """
    if not (
        settings.LINKEDIN_CLIENT_ID
        and settings.LINKEDIN_CLIENT_SECRET
        and settings.LINKEDIN_REDIRECT_URI
    ):
        messages.error(
            request,
            _(
                "LinkedIn integration is not configured. Set LINKEDIN_CLIENT_ID, "
                "LINKEDIN_CLIENT_SECRET and LINKEDIN_REDIRECT_URI."
            ),
        )
        return redirect(reverse("linkedin-setting-list"))

    state = get_random_string(32)
    request.session["linkedin_oauth_state"] = state

    params = {
        "response_type": "code",
        "client_id": settings.LINKEDIN_CLIENT_ID,
        "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
        "state": state,
        "scope": LINKEDIN_OAUTH_SCOPE,
    }
    return redirect(f"{LINKEDIN_AUTHORIZATION_URL}?{urlencode(params)}")


@login_required
def check_linkedin(request):
    """
    LinkedIn OAuth callback (redirect_uri). Exchanges the authorization
    code for an access token, fetches the authorizing user's profile,
    and creates/updates the LinkedInAccount for this company.
    """
    error = request.GET.get("error_description") or request.GET.get("error")
    if error:
        messages.error(request, _("LinkedIn authorization failed: %s") % error)
        return redirect(reverse("linkedin-setting-list"))

    code = request.GET.get("code")
    state = request.GET.get("state")
    expected_state = request.session.pop("linkedin_oauth_state", None)
    if not code:
        messages.error(request, _("LinkedIn did not return an authorization code."))
        return redirect(reverse("linkedin-setting-list"))
    if not expected_state or state != expected_state:
        messages.error(request, _("LinkedIn authorization state mismatch."))
        return redirect(reverse("linkedin-setting-list"))

    token_response = requests.post(
        LINKEDIN_ACCESS_TOKEN_URL,
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
            "client_id": settings.LINKEDIN_CLIENT_ID,
            "client_secret": settings.LINKEDIN_CLIENT_SECRET,
        },
    )
    if token_response.status_code != 200:
        logger.error("LinkedIn token exchange failed: %s", token_response.text)
        messages.error(request, _("Couldn’t exchange the LinkedIn authorization code."))
        return redirect(reverse("linkedin-setting-list"))

    access_token = token_response.json().get("access_token")

    userinfo_response = requests.get(
        LINKEDIN_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"},
    )
    if userinfo_response.status_code != 200:
        logger.error("LinkedIn userinfo fetch failed: %s", userinfo_response.text)
        messages.error(request, _("Couldn’t fetch the LinkedIn account profile."))
        return redirect(reverse("linkedin-setting-list"))

    userinfo = userinfo_response.json()
    sub_id = userinfo.get("sub")
    email = userinfo.get("email", "")
    name = userinfo.get("name") or email or sub_id

    selected_company = request.session.get("selected_company")
    company_id = (
        selected_company if selected_company and selected_company != "all" else None
    )

    account, _created = LinkedInAccount.objects.update_or_create(
        sub_id=sub_id,
        defaults={
            "username": name,
            "email": email,
            "api_token": access_token,
            "company_id_id": company_id,
        },
    )

    messages.success(request, _("LinkedIn account connected successfully."))
    return redirect(reverse("linkedin-setting-list"))


@login_required
def validate_linkedin_token(request, pk):
    linkedin_account = LinkedInAccount.objects.filter(id=pk).first()
    access_token = linkedin_account.api_token
    url = "https://api.linkedin.com/v2/userinfo"
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        messages.success(request, _("LinkedIn connection success."))
    else:
        messages.success(request, _("LinkedIn connection failed."))
    return HttpResponse("<script>$('#reloadMessagesButton').click();</script>")


def html_to_text(html):
    soup = BeautifulSoup(html, "html.parser")
    return "\n".join(
        p.get_text(strip=True)
        for p in soup.find_all(["p", "br"])
        if p.get_text(strip=True)
    )


@login_required
def post_recruitment_in_linkedin(
    request, recruitment, linkedin_acc, feed_type="feed", group_id=None
):
    site_url = request.build_absolute_uri("/")[:-1]  # Gets the base URL
    recruitment_url = (
        f"{site_url}/recruitment/application-form?recruitmentId={recruitment.id}"
    )

    payload_dict = {
        "author": f"urn:li:person:{linkedin_acc.sub_id}",
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": html_to_text(recruitment.description)},
                "shareMediaCategory": "ARTICLE",
                "media": [
                    {
                        "status": "READY",
                        "description": {"text": recruitment.description},
                        "originalUrl": recruitment_url,
                        "title": {"text": recruitment.title},
                        "thumbnails": [{"url": recruitment_url}],
                    }
                ],
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": (
                "PUBLIC" if feed_type == "feed" else "CONTAINER"
            )
        },
    }

    if feed_type == "group" and group_id:
        payload_dict["containerEntity"] = f"urn:li:group:{group_id}"

    url = "https://api.linkedin.com/v2/ugcPosts"
    payload = json.dumps(payload_dict)
    headers = {
        "Authorization": f"Bearer {linkedin_acc.api_token}",
        "Content-Type": "application/json",
    }
    response = requests.post(url, headers=headers, data=payload)
    if response.status_code == 201:
        response_data = response.json()
        recruitment.linkedin_post_id = response_data.get("id")  # Store post ID
        recruitment.save()
    else:
        recruitment.publish_in_linkedin = False
        recruitment.save()


@login_required
def delete_post(recruitment):
    """Delete recruitment post from LinkedIn"""
    linkedin_post_id = recruitment.linkedin_post_id
    if not linkedin_post_id:
        return True  # 787

    url = f"https://api.linkedin.com/v2/ugcPosts/{linkedin_post_id}"
    headers = {
        "Authorization": f"Bearer {recruitment.linkedin_account_id.api_token}",
        "Content-Type": "application/json",
    }

    response = requests.delete(url, headers=headers)
    if response.status_code == 204:
        recruitment.linkedin_post_id = None
        recruitment.save()
        return True

    return False
