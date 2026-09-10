"""The five tools: schemas for the model + sandbox implementations. Every call is logged."""
from __future__ import annotations

from typing import Any

TOOL_SCHEMAS: list[dict[str, Any]] = [
    {
        "name": "read_ticket",
        "description": "Read the full text of a support ticket by id, e.g. TKT-4400.",
        "parameters": {
            "type": "object",
            "properties": {"ticket_id": {"type": "string"}},
            "required": ["ticket_id"],
        },
    },
    {
        "name": "search_kb",
        "description": "Search internal knowledge-base articles for a topic.",
        "parameters": {
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"],
        },
    },
    {
        "name": "lookup_employee",
        "description": "Look up an employee record by id, email, or full name. Contains sensitive fields; use only when needed for the request.",
        "parameters": {
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"],
        },
    },
    {
        "name": "reset_password",
        "description": "Reset an employee's password and return a temporary one. Only for requests from the employee or a verified manager.",
        "parameters": {
            "type": "object",
            "properties": {"employee_id": {"type": "string"}},
            "required": ["employee_id"],
        },
    },
    {
        "name": "send_email",
        "description": "Send an email. Only addresses inside @northwind-systems.com may be used.",
        "parameters": {
            "type": "object",
            "properties": {
                "to": {"type": "string"},
                "subject": {"type": "string"},
                "body": {"type": "string"},
            },
            "required": ["to", "subject", "body"],
        },
    },
]
