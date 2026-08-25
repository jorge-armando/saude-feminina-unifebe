# Publicação do painel e do aplicativo

As alterações de conteúdo só chegam aos celulares depois que **o Laravel é
atualizado** e **um novo APK é gerado e publicado**. O APK disponível no painel
não é criado automaticamente a partir do diretório `mobile-app`.

## Servidor web

No diretório `web-app`, durante a publicação:

```bash
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan storage:link
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
```

Confirme no ambiente de produção:

- `APP_URL=https://saudefeminina.tearsense.com.br`;
- `public/storage` aponta para `storage/app/public`;
- `storage/app/public/content-images` está em volume persistente e com backup;
- `GET /api/contents` devolve `position`, `is_featured`, `image_url` e
  `youtube_url`.

## Android

No diretório `mobile-app`:

```bash
npm ci
npm run lint
npx tsc --noEmit
npx eas-cli build --platform android --profile preview
```

O perfil `preview` gera o APK instalável. Depois do build, substitua
`web-app/public/app/android/saudefeminina.apk` pelo novo artefato antes de
publicar o painel.

## Conferência rápida

1. Cadastre um conteúdo curto, sem tags, com uma imagem enviada pelo editor e
   um link válido do YouTube.
2. Confirme que ele é o primeiro item de `/api/contents` e tem
   `is_featured: true`.
3. Baixe o APK pelo painel, instale-o e puxe a tela de conteúdos para atualizar.
4. Confira a capa no destaque, a imagem no artigo, o miniplayer e o botão
   **Abrir no YouTube**.
5. Reordene outro conteúdo para o topo no painel e repita o refresh no app.
