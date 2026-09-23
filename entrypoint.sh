#!/bin/bash
set -e

echo "Waiting for database to be ready..."
python3 manage.py makemigrations
python3 manage.py migrate
python3 manage.py collectstatic --noinput
python3 manage.py createhorillauser --first_name admin --last_name admin --username admin --password admin --email admin@example.com --phone 1234567890

# WEB_CONCURRENCY must stay at 1: several apps start an in-process
# APScheduler in apps.py ready() (payroll, attendance, leave, etc.) —
# more than one gunicorn worker means duplicate scheduled jobs.
exec gunicorn --bind 0.0.0.0:${PORT:-8000} --workers ${WEB_CONCURRENCY:-1} horilla.wsgi:application
