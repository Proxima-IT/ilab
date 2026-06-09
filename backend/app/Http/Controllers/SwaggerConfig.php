<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: "1.0.0",
    title: "E-Learning Platform API Documentation",
    description: "Backend API endpoints for React Web and Flutter Mobile application.",
    contact: new OA\Contact(email: "admin@yourdomain.com")
)]
#[OA\Server(
    url: "http://127.0.0.1:8000",
    description: "Local Development Server"
)]
#[OA\Server(
    url: "https://dev-api.yourdomain.com",
    description: "Development Server"
)]
#[OA\Server(
    url: "https://api.yourdomain.com",
    description: "Production Server"
)]
#[OA\SecurityScheme(
    securityScheme: "sanctum",
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "Enter your Sanctum token to access secured endpoints"
)]
class SwaggerConfig extends Controller
{
    
    #[OA\Get(
        path: "/api/health-check",
        summary: "API Health Check",
        description: "Check if the backend API server is running smoothly.",
        tags: ["System"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Server is healthy and up!"
            )
        ]
    )]
    public function healthCheck()
    {
        return response()->json(['status' => 'healthy']);
    }
}