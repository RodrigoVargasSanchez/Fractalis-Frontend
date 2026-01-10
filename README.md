# Fractal-IS Frontend

Esta es la interfaz de usuario de **Fractal-IS**, una aplicación web diseñada para la gestión de proyectos y visualización de datos procesados por IA. El frontend permite a los usuarios cargar transcripciones, gestionar espacios de trabajo y visualizar los resultados del análisis de grafos.

##  Stack Tecnológico

* **Framework:** Next.js 15 (App Router).
* **Lenguaje:** TypeScript.
* **Estilos:** Tailwind CSS.
* **Comunicación API:**
    * **REST:** Para procesos de carga y servicios de IA.
    * **GraphQL:** Para consultas de datos eficientes y visualización de registros.
* **Iconos & UI:** Lucide React y componentes personalizados.

##  Instalación y Uso

### Requisitos Previos

* **Node.js**.
* **NPM** o **Yarn**.

### Pasos para el despliegue local

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/RodrigoVargasSanchez/Fractalis-Fronted.git](https://github.com/RodrigoVargasSanchez/Fractalis-Fronted.git)
    cd proyecto-frontend
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env.local` en la raíz del proyecto y copia las variables de `.env.example`:
    ```bash
    NEXT_PUBLIC_API_URL=http://localhost:5000
    NEXT_PUBLIC_GRAPHQL_URL=http://localhost:5000/graphql
    ```
    *Nota: Se recomienda el puerto 5000 para sincronizar con el contenedor del backend.*

4.  **Ejecutar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```

La aplicación estará disponible en http://localhost:3000.

##  Estructura del Proyecto

* `app/`: Rutas, páginas y layouts (App Router).
* `components/`: Componentes de interfaz (Formularios, Modales, Sidebar).
* `hooks/`: Lógica compartida y hooks personalizados.
* `lib/`: Configuración de clientes API y utilidades de formato.
* `public/`: Assets estáticos e imágenes.

##  Integración con el Sistema

El frontend funciona como el orquestador visual del sistema Fractal-IS:
1.  **Envío de Datos:** Captura las transcripciones y las envía al backend para su procesamiento.
2.  **Visualización:** Consume la API GraphQL para mostrar los espacios guardados y la información de los participantes en tiempo real.
3.  **Feedback:** Implementa un sistema de modales para errores y confirmaciones de procesos de IA.

##  Características Principales

* **Carga de Archivos:** Interfaz diseñada para el procesamiento de archivos de datos.
* **Visualización de espacios:** Gestión centralizada de los espacios de trabajo.
* **Validación:** Manejo de estados de carga y errores durante la sincronización con IA.
