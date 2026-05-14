# Integração com API - Mobile App

## 📦 Instalação

O projeto usa **@tanstack/react-query** para gerenciamento de estado e requisições HTTP.

```bash
npm install @tanstack/react-query
```

## 🏗️ Estrutura

### 1. Configuração do QueryClient (`app/_layout.tsx`)

O QueryClient foi configurado no layout raiz da aplicação:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});
```

### 2. Serviço de API (`services/api.ts`)

Contém todas as funções de comunicação com a API Laravel:

- `getContents()` - Lista todos os conteúdos
- `getContentById(id)` - Busca um conteúdo específico
- `searchContents(query)` - Busca conteúdos por texto
- `getContentsByTag(tag)` - Filtra conteúdos por tag

**Endpoint base:** `https://app.saude-feminina.test/api`

### 3. Hooks Customizados (`hooks/useContents.ts`)

Hooks React Query para facilitar o uso:

- `useContents()` - Hook para listar conteúdos
- `useContent(id)` - Hook para buscar um conteúdo
- `useSearchContents(query)` - Hook para busca
- `useContentsByTag(tag)` - Hook para filtrar por tag

### 4. Implementação na Página (`app/user/content.tsx`)

A página de conteúdos foi atualizada para:

- ✅ Carregar dados reais da API
- ✅ Exibir loading state
- ✅ Tratar erros com retry
- ✅ Filtrar por tags
- ✅ Busca em tempo real
- ✅ Navegação para detalhes com ID

## 🎯 Funcionalidades

### Loading State
Exibe um indicador de carregamento enquanto busca os dados:

```tsx
{isLoading && (
  <ActivityIndicator size="large" color="#ec4899" />
)}
```

### Error State
Trata erros com opção de retry:

```tsx
{error && (
  <TouchableOpacity onPress={() => refetch()}>
    <Text>Tentar novamente</Text>
  </TouchableOpacity>
)}
```

### Filtros Dinâmicos
Filtra conteúdos baseado em tags:

```tsx
const matchesFilter =
  selectedFilter === "Todos" ||
  content.tags.toLowerCase().includes(selectedFilter.toLowerCase());
```

### Busca
Busca em título e tags:

```tsx
const matchesSearch =
  searchQuery.length === 0 ||
  content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
  content.tags.toLowerCase().includes(searchQuery.toLowerCase());
```

## 📊 Formato dos Dados

```typescript
interface Content {
  id: number;
  title: string;
  content: string;  // Markdown
  tags: string;     // CSV de tags
  reading_time: number;
  created_at: string;
  updated_at: string;
}
```

## 🚀 Uso

```tsx
import { useContents } from '../../hooks/useContents';

function MyComponent() {
  const { data, isLoading, error, refetch } = useContents();
  
  // data.data contém o array de conteúdos
  const contents = data?.data || [];
  
  return (
    // ... seu componente
  );
}
```

## 🔄 Cache e Stale Time

- **Cache**: Os dados ficam em cache por padrão
- **Stale Time**: 5 minutos (dados considerados "frescos")
- **Retry**: Até 2 tentativas em caso de erro

## 📱 Próximos Passos

- [ ] Implementar página de detalhes com renderização de Markdown
- [ ] Adicionar paginação/infinite scroll
- [ ] Implementar favoritos (salvos)
- [ ] Adicionar cache offline com AsyncStorage
- [ ] Implementar pull-to-refresh
