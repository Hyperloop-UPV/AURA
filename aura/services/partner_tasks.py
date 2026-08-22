import frappe


PLACEHOLDER_NAME = "{name}"


def get_task_templates(tier_name):
    """
    Devuelve todas las plantillas correspondientes a un Partner Tier,
    incluyendo las heredadas de sus tiers inferiores.

    El orden es desde el tier más básico hasta el seleccionado.

    Ejemplo:
        Gold -> Silver -> Collaborator

    devuelve:
        Collaborator tasks
        Silver tasks
        Gold tasks
    """

    tiers = []
    visited = set()
    current_tier = tier_name

    while current_tier:
        if current_tier in visited:
            frappe.throw(
                f"Se ha detectado una referencia circular "
                f"en los Partner Tiers: {current_tier}"
            )

        visited.add(current_tier)

        tier = frappe.get_doc(
            "Partner Tier",
            current_tier,
        )

        tiers.append(tier)

        current_tier = tier.parent_tier

    # Actualmente:
    # Gold -> Silver -> Collaborator
    #
    # Queremos:
    # Collaborator -> Silver -> Gold
    tiers.reverse()

    templates = []

    for tier in tiers:
        for template in tier.task_templates:
            templates.append(template)

    return templates


def _get_organization_name(deal):
    """
    Obtiene el nombre legible de la organización asociada al Deal.
    """

    if not deal.organization:
        frappe.throw(
            f"El Deal {deal.name} no tiene ninguna organización asociada."
        )

    organization_name = frappe.db.get_value(
        "CRM Organization",
        deal.organization,
        "organization_name",
    )

    return organization_name or deal.organization


def _render_template(text, organization_name):
    """
    Sustituye placeholders dentro de una plantilla.

    Actualmente:
        {name} -> nombre de la organización
    """

    if not text:
        return ""

    return text.replace(
        PLACEHOLDER_NAME,
        organization_name,
    )


def _get_partner_tier(deal):
    """
    Obtiene el Partner Tier asignado al CRM Deal.
    """

    meta = frappe.get_meta("CRM Deal")

    tier_fields = [
        field
        for field in meta.fields
        if field.fieldtype == "Link"
        and field.options == "Partner Tier"
    ]

    if not tier_fields:
        frappe.throw(
            "CRM Deal no tiene ningún campo Link a Partner Tier."
        )

    tier_field = tier_fields[0]

    tier_name = deal.get(
        tier_field.fieldname
    )

    if not tier_name:
        frappe.throw(
            f"El Deal {deal.name} no tiene ningún Partner Tier asignado."
        )

    return tier_name


def create_partner_task(deal_name, template):
    """
    Crea una CRM Task a partir de una Partner Tier Task Template.

    Reglas:
    - {name} se sustituye por el nombre de la organización.
    - El título SIEMPRE empieza por [Nombre organización].
    - La tarea queda vinculada al CRM Deal.
    - Ventaja Partner queda marcada.
    """

    deal = frappe.get_doc(
        "CRM Deal",
        deal_name,
    )

    organization_name = _get_organization_name(
        deal
    )

    rendered_title = _render_template(
        template.title_template,
        organization_name,
    )

    rendered_description = _render_template(
        template.description_template,
        organization_name,
    )

    # Este prefijo es independiente del placeholder {name}.
    #
    # SIEMPRE:
    # [Siemens] Título de la tarea
    title = (
        f"[{organization_name}] "
        f"{rendered_title}"
    ).strip()

    task = frappe.get_doc({
        "doctype": "CRM Task",

        "title": title,

        "description": rendered_description,

        "status": "Todo",

        "priority": template.priority or "Medium",

        "due_date": template.due_date,

        "reference_doctype": "CRM Deal",

        "reference_docname": deal.name,

        "custom_ventaja_partner": 1,
    })

    task.insert()

    return task


def create_partner_tasks(deal_name):
    """
    Crea todas las tareas correspondientes al Partner Tier
    de un Deal, incluyendo las tareas heredadas.

    Ejemplo:

        Gold
        ├── Collaborator tasks
        ├── Silver tasks
        └── Gold tasks
    """

    deal = frappe.get_doc(
        "CRM Deal",
        deal_name,
    )

    tier_name = _get_partner_tier(
        deal
    )

    templates = get_task_templates(
        tier_name
    )

    created_tasks = []

    for template in templates:
        task = create_partner_task(
            deal_name,
            template,
        )

        created_tasks.append(task)

    return created_tasks


def create_partner_tasks(deal_name):
    """
    Crea todas las tareas correspondientes al Partner Tier
    de un Deal, incluyendo las tareas heredadas.
    """

    deal = frappe.get_doc("CRM Deal", deal_name)

    tier_name = _get_partner_tier(deal)

    templates = get_task_templates(tier_name)

    created_tasks = []

    for template in templates:
        task = create_partner_task(
            deal_name,
            template,
        )

        created_tasks.append(task)

    return created_tasks

@frappe.whitelist()
def generate_partner_tasks(deal_name):
    """
    Endpoint utilizado desde el botón 'Generar ventajas'
    del CRM Deal.

    Devuelve un resultado estructurado para que el frontend
    pueda informar claramente al usuario.
    """

    deal = frappe.get_doc("CRM Deal", deal_name)

    # El usuario debe poder acceder al Deal.
    deal.check_permission("read")

    # Validación: organización
    if not deal.organization:
        return {
            "success": False,
            "message": (
                "No se han generado las ventajas: "
                "el Deal no tiene una organización asignada."
            ),
        }

    # Validación: Partner Tier
    try:
        tier_name = _get_partner_tier(deal)
    except frappe.ValidationError:
        return {
            "success": False,
            "message": (
                "No se han generado las ventajas: "
                "el Deal no tiene un Partner Tier asignado."
            ),
        }

    # Validación: el tier tiene tareas
    templates = get_task_templates(tier_name)

    if not templates:
        return {
            "success": False,
            "message": (
                f"No se han generado las ventajas: "
                f"el tier {tier_name} no tiene tareas configuradas."
            ),
        }

    # Generación real
    tasks = create_partner_tasks(deal_name)

    organization_name = _get_organization_name(deal)

    return {
        "success": True,
        "message": (
            f"Se han generado correctamente "
            f"{len(tasks)} ventajas para "
            f"{organization_name} ({tier_name})."
        ),
        "created_count": len(tasks),
        "organization": organization_name,
        "tier": tier_name,
        "tasks": [task.name for task in tasks],
    }