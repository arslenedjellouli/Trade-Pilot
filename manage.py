#!/usr/bin/env python
"""Django management script."""
import os
import sys


def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ensia_project.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Activate the virtual environment first:\n"
            "  .venv\\Scripts\\activate"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
