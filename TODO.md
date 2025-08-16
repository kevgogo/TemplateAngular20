// agregar pagina para permisos
<!-- Renderiza el botón sólo si el usuario tiene el permiso -->
<button *appHasPermission="'PRODUCT_CREATE'" class="btn btn-primary">
  Nuevo producto
</button>

<!-- Con else -->
<ng-container *appHasPermission="'SYSTEM_EDIT'; else noEdit">
  <a class="btn btn-warning">Editar</a>
</ng-container>
<ng-template #noEdit>
  <span class="text-muted">Sin permiso para editar</span>
</ng-template>