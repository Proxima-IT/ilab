<?php

use App\Http\Controllers\SeoPageController;
use Illuminate\Support\Facades\Route;

Route::get('/courses/{slug}', [SeoPageController::class, 'course'])
    ->where('slug', '[A-Za-z0-9\-]+');

Route::get('/blog/{slug}', [SeoPageController::class, 'blog'])
    ->where('slug', '[A-Za-z0-9\-]+');

Route::get('/events/{slug}', [SeoPageController::class, 'event'])
    ->where('slug', '[A-Za-z0-9\-]+');

Route::get('/', function () {
    return view('welcome');
});
