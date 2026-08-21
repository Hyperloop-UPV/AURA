import frappe


def get_tier_task_templates(tier_name):
    """
    Devuelve todas las plantillas de tareas asociadas a un Partner Tier,
    incluyendo las heredadas de sus tiers padre.

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
                f"Se ha detectado un ciclo en los Partner Tiers: {current_tier}"
            )

        visited.add(current_tier)

        tier = frappe.get_doc("Partner Tier", current_tier)
        tiers.append(tier)

        current_tier = tier.parent_tier

    # Ahora mismo tenemos:
    # Gold, Silver, Collaborator
    #
    # Lo invertimos para obtener:
    # Collaborator, Silver, Gold


    print(tiers)

    tiers.reverse()

    templates = []

    for tier in tiers:
        print(tier)
        print(tier.task_templates)
        for template in tier.task_templates:
            templates.append(
                {
                    "tier": tier.name,
                    "title_template": template.title_template,
                    "description_template": template.description_template,
                    "priority": template.priority,
                    "due_date": template.due_date,
                }
            )

    return templates