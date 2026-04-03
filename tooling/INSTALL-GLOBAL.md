# Instalación Global - Specification-Driven Agents CLI

## Instrucciones para instalar y probar globalmente

### Opción 1: Instalación desde npm (cuando esté publicado)
```bash
npm install -g spec-driven-agents
```

### Opción 2: Instalación desde local (desarrollo)
```bash
# 1. Navegar al directorio del tooling
cd C:\Users\lupit\projects\specification-driven-agents\tooling

# 2. Construir el proyecto
npm run build

# 3. Instalar globalmente
npm install -g .

# Alternativa: Usar npm link (para desarrollo)
npm link
```

### Opción 3: Instalación manual (sin npm)
```bash
# 1. Construir
cd C:\Users\lupit\projects\specification-driven-agents\tooling
npm run build

# 2. Crear enlace simbólico manual (Windows)
# Agregar al PATH o crear un script batch
```

## Verificar instalación

```bash
# Verificar que el comando esté disponible
sda --help

# Verificar versión
sda --version

# Probar generación de spec
sda generate domain test-project --force
```

## Probar en un repositorio real

```bash
# 1. Crear un directorio de prueba
mkdir test-sda-project
cd test-sda-project

# 2. Inicializar proyecto (cuando implementemos el comando init)
# sda init

# 3. Generar specs
sda generate genesis project-foundation --force
sda generate standard security-rules --force
sda generate domain user-management --force

# 4. Verificar estructura creada
dir /B specs\

# 5. Validar specs generados
sda validate specs/domain-user-management.yaml
```

## Solución de problemas

### Si `sda` no se encuentra después de `npm install -g`:
```bash
# Verificar que npm global bin esté en PATH
echo %PATH%

# En Windows, la ubicación típica es:
# C:\Users\<username>\AppData\Roaming\npm

# Verificar instalación
npm list -g --depth=0 | findstr spec-driven-agents
```

### Si hay errores de permisos:
```bash
# Ejecutar como administrador (Windows)
npm install -g . --force

# O limpiar cache
npm cache clean --force
```

### Si el build falla:
```bash
# Limpiar y reconstruir
rmdir /s node_modules
rmdir /s dist
npm install
npm run build
```

## Comandos disponibles después de instalación

✅ **sda generate** - Generar especificaciones desde templates  
⏳ **sda validate** - Validar specs (Fase 3)  
⏳ **sda validate-project** - Validar proyecto completo (Fase 5)  
⏳ **sda resolve** - Resolver jerarquía de autoridad (Fase 4)  
⏳ **sda status** - Actualizar estado (Fase 6)  
⏳ **sda graph** - Generar gráfico de dependencias (Fase 6)  
⏳ **sda init** - Inicializar proyecto (por implementar)

## Estructura después de instalación global

```
# Ubicación global de npm (Windows)
C:\Users\lupit\AppData\Roaming\npm\
├── sda.cmd                    # Wrapper de comando
├── sda                        # Script bash (si aplica)
└── node_modules\
    └── spec-driven-agents\    # Paquete instalado
        ├── dist\              # Código compilado
        ├── templates\         # Plantillas YAML
        ├── bin\               # Bin wrapper
        └── package.json       # Metadatos
```

## Desinstalación

```bash
# Desinstalar globalmente
npm uninstall -g spec-driven-agents

# Remover link de desarrollo
npm unlink spec-driven-agents
```

## Próximos pasos después de instalación

1. **Probar generación** en diferentes tipos de specs
2. **Verificar output** YAML válido
3. **Integrar con proyecto existente**
4. **Continuar con Fase 3** (validación)