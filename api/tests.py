import json
import os
from unittest.mock import patch

from django.test import TestCase

from .models import Product


class APIAuthenticationTests(TestCase):
    def setUp(self):
        self.credentials = {
            'AUTH_EMAIL': 'admin@example.com',
            'AUTH_PASSWORD': 'test-password',
        }
        self.login_payload = {
            'email': self.credentials['AUTH_EMAIL'],
            'password': self.credentials['AUTH_PASSWORD'],
        }
        self.env = patch.dict(os.environ, self.credentials)
        self.env.start()
        self.addCleanup(self.env.stop)

    def test_api_requires_a_valid_bearer_token(self):
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, 401)

        invalid = self.client.post(
            '/api/auth/login/',
            data=json.dumps({'email': 'admin@example.com', 'password': 'wrong'}),
            content_type='application/json',
        )
        self.assertEqual(invalid.status_code, 401)

        login = self.client.post(
            '/api/auth/login/',
            data=json.dumps(self.login_payload),
            content_type='application/json',
        )
        self.assertEqual(login.status_code, 200)

        self.client.defaults['HTTP_AUTHORIZATION'] = f"Bearer {login.json()['token']}"
        self.assertEqual(self.client.get('/api/products/').status_code, 200)


class ProductAPITests(TestCase):
    def setUp(self):
        self.env = patch.dict(
            os.environ,
            {'AUTH_EMAIL': 'admin@example.com', 'AUTH_PASSWORD': 'test-password'},
        )
        self.env.start()
        self.addCleanup(self.env.stop)
        login = self.client.post(
            '/api/auth/login/',
            data=json.dumps({
                'email': 'admin@example.com',
                'password': 'test-password',
            }),
            content_type='application/json',
        )
        self.client.defaults['HTTP_AUTHORIZATION'] = f"Bearer {login.json()['token']}"

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
