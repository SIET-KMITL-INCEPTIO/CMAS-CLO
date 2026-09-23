# features/

**One folder per feature, holding every client file for that feature.** The folder
name matches the server module in `app/server/src/modules/` word for word, so
searching one name (`courses`) finds both sides.

```
features/courses/
├── CourseList.page.tsx      route target — default export, lazy-loaded by pages.config.ts
├── CourseTable.tsx          components used only by this feature — named exports
├── useCourses.ts            TanStack Query hooks — the only code that calls the API
├── courses.api.ts           typed wrappers around apiClient for this feature's endpoints
├── course.types.ts          DTOs / view models this feature owns
└── CourseTable.test.tsx     tests sit next to the file they cover
```

The data flow is the same for every feature:

```
Xxx.page.tsx  →  useXxx.ts  →  xxx.api.ts  →  lib/apiClient.ts  →  server modules/xxx/
```

## Naming

| File        | Case                                         | Example                |
| ----------- | -------------------------------------------- | ---------------------- |
| Folder      | `kebab-case`, same word as the server module | `course-report/`       |
| Page        | `PascalCase.page.tsx`                        | `CourseList.page.tsx`  |
| Component   | `PascalCase.tsx`                             | `CourseTable.tsx`      |
| Hook        | `useCamelCase.ts`                            | `useCourses.ts`        |
| API wrapper | `camelCase.api.ts`                           | `courses.api.ts`       |
| Types       | `camelCase.types.ts`                         | `course.types.ts`      |
| Test        | same name + `.test.ts(x)`                    | `CourseTable.test.tsx` |

## When to move something out

A file moves to `components/`, `hooks/`, `lib/` or `types/` only when a **second**
feature needs it. Until then it stays in its feature folder.

## Adding a feature

1. Create `features/<name>/` here and `modules/<name>/` on the server.
2. Add the page to `src/pages.config.ts`.
3. Keep `src/` at most 4 levels deep. If a feature needs sub-folders, split it
   into two features instead.
