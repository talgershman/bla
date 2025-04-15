import {Compiler, ComponentFactory, inject, Injectable, Injector, Type} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LazyLoadComponentService {
  private compiler = inject(Compiler);
  private injector = inject(Injector);

  async loadComponent(
    module: Type<unknown>,
    component: Type<unknown>,
  ): Promise<ComponentFactory<any>> {
    const moduleFactory = this.compiler.compileModuleSync(module);
    const moduleRef = moduleFactory.create(this.injector);
    return moduleRef.componentFactoryResolver.resolveComponentFactory(component);
  }
}
