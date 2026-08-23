import frappe
from frappe.model.document import Document


class PartnerTier(Document):

    def validate(self):
        self.validate_parent_tier()

    def validate_parent_tier(self):
        """
        Comprueba que la jerarquía de Partner Tiers no contenga ciclos.

        Ejemplos no permitidos:

            Gold -> Gold

            Gold -> Silver
            Silver -> Gold
        """

        if not self.parent_tier:
            return

        # No permitir que un tier sea su propio padre
        if self.parent_tier == self.name:
            frappe.throw(
                "A Partner Tier cannot be its own parent."
            )

        visited = {self.name}
        current_tier = self.parent_tier

        while current_tier:
            if current_tier in visited:
                frappe.throw(
                    "A circular reference has been detected "
                    "in the Partner Tier hierarchy."
                )

            visited.add(current_tier)

            current_tier = frappe.db.get_value(
                "Partner Tier",
                current_tier,
                "parent_tier",
            )