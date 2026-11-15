import uuid
from django.db import models


class Product(models.Model):
    product_id  = models.CharField(max_length=64, unique=True, default='')
    name        = models.CharField(max_length=500, blank=True, default='')
    product_data = models.JSONField(default=dict)
    image_path  = models.CharField(max_length=500, blank=True, default='')
    lang        = models.CharField(max_length=10, default='en')
    markets     = models.JSONField(default=list)
    compliance  = models.JSONField(default=dict)
    history     = models.JSONField(default=list)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def to_dict(self):
        pd = self.product_data or {}
        features = pd.get('features') or []
        return {
            'id':          self.product_id,
            'name':        self.name or pd.get('name', ''),
            'productData': pd,
            'imagePath':   self.image_path,
            'lang':        self.lang,
            'markets':     self.markets or [],
            'compliance':  self.compliance or {},
            'history':     self.history or [],
            'aiContent': {
                'description':   pd.get('description', ''),
                'sellingPoints': features,
                'benefits':      [x for x in [
                    pd.get('category', ''),
                    pd.get('country_of_origin', ''),
                    pd.get('format', ''),
                ] if x],
            },
            'createdAt': self.created_at.isoformat() if self.created_at else '',
        }
