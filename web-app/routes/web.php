<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::get('/login', [AuthController::class, 'login'])->name('login');
Route::post('/login', [AuthController::class, 'autenticar'])->name('login.autenticar');

Route::get('/painel', function () {
    return view('dashboard');
})->middleware('auth');

Route::get('/novo-conteudo', function () {
    return view('contents.create');
})->middleware('auth');

Route::post('/sair', [AuthController::class, 'sair'])->name('sair');

Route::redirect('/', '/login');