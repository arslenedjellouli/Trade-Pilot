import json

from django.test import TestCase

from .models import Product


class ProductAPITests(TestCase):
    def test_product_list_is_available_without_login(self):
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, 200)

    def test_product_can_be_loaded_by_id_after_creation(self):
        created = self.client.post(
            '/api/products/',
            data=json.dumps({
                'name': 'Algerian Dates',
                'productData': {'name': 'Algerian Dates', 'category': 'Food'},
            }),
            content_type='application/json',
        )
        self.assertEqual(created.status_code, 201)
        product_id = created.json()['id']

        loaded = self.client.get(f'/api/products/{product_id}/')
        self.assertEqual(loaded.status_code, 200)
        self.assertEqual(loaded.json()['name'], 'Algerian Dates')


class ProductModelTests(TestCase):
    def test_product_dictionary_has_stable_frontend_shape(self):
        product = Product.objects.create(
            product_id='prod-test',
            name='Test product',
            product_data={'description': 'A test', 'features': ['One']},
        )
        payload = product.to_dict()
        self.assertEqual(payload['id'], 'prod-test')
        self.assertEqual(payload['aiContent']['sellingPoints'], ['One'])
