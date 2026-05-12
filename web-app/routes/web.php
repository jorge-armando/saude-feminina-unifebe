<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect('/painel');
    }

    return redirect('/login');
});

Route::middleware('guest')->group(function () {

    Route::get('/login', [AuthController::class, 'login'])
        ->name('login');

    Route::post('/login', [AuthController::class, 'autenticar'])
        ->name('login.autenticar');

});

Route::middleware('auth')->group(function () {

    Route::get('/painel', function () {
        return view('dashboard');
    })->name('painel');

    Route::get('/novo-conteudo', function () {
        return view('contents.create');
    });

    Route::post('/sair', [AuthController::class, 'sair'])
        ->name('sair');

});

Route::fallback(function () {
    return redirect('/');
});