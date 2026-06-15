<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

#[OA\Info(
    version: '1.0.0',
    title: 'iLab EdTech API Documentation',
    description: 'Versioned REST API documentation for the iLab React Web SPA and Android/iOS mobile applications.',
    contact: new OA\Contact(
        name: 'Proxima IT',
        email: 'admin@yourdomain.com'
    )
)]
#[OA\Server(
    url: 'http://127.0.0.1:8000',
    description: 'Local Development Server'
)]
#[OA\Server(
    url: 'https://dev-api.yourdomain.com',
    description: 'Development Server'
)]
#[OA\Server(
    url: 'https://api.yourdomain.com',
    description: 'Production Server'
)]
#[OA\SecurityScheme(
    securityScheme: 'sanctum',
    type: 'http',
    scheme: 'bearer',
    description: 'Laravel Sanctum Bearer Token. Example: Bearer {access_token}'
)]
#[OA\Tag(
    name: 'System',
    description: 'System health and API status endpoints'
)]
class SwaggerConfig extends Controller
{
    #[OA\Get(
        path: '/api/v1/health-check',
        summary: 'API Health Check',
        description: 'Check if the backend API server is running.',
        tags: ['System'],
        security: [],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Server is healthy.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'status', type: 'string', example: 'healthy'),
                                new OA\Property(property: 'service', type: 'string', example: 'iLab API')
                            ]
                        ),
                        new OA\Property(property: 'message', type: 'string', example: 'API is running.'),
                        new OA\Property(property: 'errors', type: 'string', nullable: true, example: null)
                    ]
                )
            )
        ]
    )]
    public function healthCheck(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'status' => 'healthy',
                'service' => 'iLab API',
            ],
            'message' => 'API is running.',
            'errors' => null,
        ]);
    }
}