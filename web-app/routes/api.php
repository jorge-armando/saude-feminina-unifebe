<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ContentController;

Route::get('/contents', [ContentController::class, 'apiIndex']);
Route::get('/contents/{content}', [ContentController::class, 'show']);
