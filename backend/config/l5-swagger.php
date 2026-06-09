<?php

return [
    'default' => 'default',
    'documentations' => [
        'default' => [
            'api' => [
                'title' => 'E-Learning Platform API Documentation',
            ],
            'routes' => [
                'api' => 'api/documentation',
            ],
            'paths' => [
                'use_absolute_path' => env('L5_SWAGGER_USE_ABSOLUTE_PATH', true),
                'docs_json' => 'api-docs.json',
                'docs_yaml' => 'api-docs.yaml',
                'format_to_use' => env('L5_FORMAT_TO_USE', 'json'),
                'annotations' => [
                    base_path('app/Http'), 
                ],
            ],
        ],
    ],
    'defaults' => [
        'routes' => [
            'docs' => 'docs',
            'oauth2_callback' => 'api/oauth2-callback',
            'middleware' => [
                'api' => [],
                'asset' => [],
                'docs' => [
                    // Uncomment and add your own middleware class here to restrict access in production
                    // \App\Http\Middleware\RestrictDocsInProduction::class,
                ],
                'oauth2_callback' => [],
            ],
        ],
        'paths' => [
            'docs' => storage_path('api-docs'),
            'views' => base_path('resources/views/vendor/l5-swagger'),
            'base' => env('L5_SWAGGER_BASE_PATH', null),
            'swagger_ui_assets_path' => env('L5_SWAGGER_UI_ASSETS_PATH', 'vendor/l5-swagger'),
            'excludes' => [],
        ],
        'scanOptions' => [
            'analyzer' => null,
            'analysis' => null,
            'processors' => [],
            'pattern' => '*.php',
            'exclude' => [],
            'open_api_spec_version' => env('L5_SWAGGER_OPEN_API_SPEC_VERSION', \OpenApi\Annotations\OpenApi::VERSION_3_0_0),
        ],
        'securityDefinitions' => [
            'securitySchemes' => [],
            'security' => [],
        ],
        'operations_sort' => env('L5_SWAGGER_OPERATIONS_SORT', null),
        'validator_url' => null,
        'ui' => [
            'display' => [
                'doc_expansion' => env('L5_SWAGGER_DOC_EXPANSION', 'none'),
                'filter' => env('L5_SWAGGER_FILTER', false),
            ],
        ],
        'generate_always' => env('L5_SWAGGER_GENERATE_ALWAYS', false),
        'generate_yaml_copy' => env('L5_SWAGGER_GENERATE_YAML_COPY', false),
        'proxy' => false,
        'additional_config_vars' => [],
        
        'additional_config_url' => null,
    ],
];