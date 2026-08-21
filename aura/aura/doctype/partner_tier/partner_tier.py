# Copyright (c) 2026, Javier Ribal del Río and contributors
# For license information, please see license.txt

# import frappe
import frappe
from frappe.model.document import Document

# partner_tier.py

class PartnerTier(Document):
    def validate(self):
        self.validate_parent_tier()
