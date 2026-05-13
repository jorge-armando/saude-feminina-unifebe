<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ContentController;

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

    Route::get('/painel', [ContentController::class, 'index'])
        ->name('painel');

    Route::get('/novo-conteudo', [ContentController::class, 'create'])
        ->name('conteudos.create');

    Route::post('/conteudos', [ContentController::class, 'store'])
        ->name('conteudos.store');

    Route::delete('/conteudos/{content}', [ContentController::class, 'destroy'])
        ->name('contents.destroy');

    Route::post('/sair', [AuthController::class, 'sair'])
        ->name('sair');

    Route::get('/conteudos/{content}/editar', [ContentController::class, 'edit'])
        ->name('contents.edit');

    Route::put('/conteudos/{content}', [ContentController::class, 'update'])
        ->name('contents.update');
});

Route::fallback(function () {
    return redirect('/');
});