# BUILD INSTRUCTIONS - FASE 2

## Pasos para construir y probar el tooling:

### 1. Verificar que todo esté en su lugar:
```bash
cd C:\Users\lupit\projects\specification-driven-agents\tooling
dir templates\*.yaml
```

**Debes ver 10 archivos YAML.**

### 2. Verificar código TypeScript:
```bash
dir src\generators\*.ts
dir src\cli\*.ts
```

**Debes ver:**
- `src/generators/template-loader.ts`
- `src/generators/spec-generator.ts`
- `src/cli/generate.ts`

### 3. Ejecutar build:
```bash
npm run build
```

**Salida esperada:**
```
> @spec-driven-agents/tooling@0.1.0 build
> tsup

CLI Building entry: src/index.ts
CLI Using tsconfig: tsconfig.json
CLI tsup v8.5.1
CLI Using tsup config: C:\...\tsup.config.ts
CLI Target: node18
CLI Cleaning output folder
ESM Build start
ESM dist\index.js     X.XX KB
ESM dist\index.js.map X.XX KB
ESM ⚡️ Build success in XXms
DTS Build start
DTS ⚡️ Build success in XXXms
DTS dist\index.d.ts XX.XX B
```

### 4. Probar CLI:
```bash
node dist/index.js --help
```

**Debes ver:**
- Banner ASCII "SDA Tooling"
- Comando `generate` listado
- Otros comandos (placeholder para fases futuras)

### 5. Probar generación de spec:
```bash
# Crear spec de dominio
node dist/index.js generate domain test-user --force

# Crear spec de standard
node dist/index.js generate standard security-rules --force
```

**Archivos generados:**
- `specs/domain-test-user.yaml`
- `specs/standard-security-rules.yaml`

### 6. Verificar specs generados:
```bash
type specs\domain-test-user.yaml
```

**Contenido esperado:**
- YAML válido
- `meta.id: domain-test-user`
- `meta.type: domain`
- `meta.title: Test User Domain Specification`
- Placeholders reemplazados con valores

## Solución de problemas:

### Si el build falla:
```bash
# Limpiar y reinstalar
rmdir /s node_modules
rmdir /s dist
npm install
npm run build
```

### Si hay errores de TypeScript:
```bash
npx tsc --noEmit
```

### Si la generación falla:
```bash
# Verificar que templates existan
dir templates
```

## Estado esperado después de FASE 2:

✅ **templates/** - 10 plantillas YAML  
✅ **src/generators/** - Sistema de generación  
✅ **src/cli/generate.ts** - Comando CLI  
✅ **dist/index.js** - Build compilado  
✅ **specs/** - Specs de prueba generados  
✅ **Funcionalidad:** `sda generate <type> <name>`

## Próximos pasos (FASE 3):
1. Implementar `sda validate <path>`
2. Validar specs contra schema YAML
3. Mejorar mensajes de error
4. Añadir tests de validación