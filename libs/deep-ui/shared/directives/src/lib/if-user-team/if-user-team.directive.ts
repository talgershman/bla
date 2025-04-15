import {Directive, inject, input, OnInit, TemplateRef, ViewContainerRef} from '@angular/core';
import {DeepUtilService} from 'deep-ui/shared/core';
import _intersection from 'lodash-es/intersection';

@Directive({
  selector: '[ifUserTeam]',
})
export class IfUserTeamDirective implements OnInit {
  allowedTeams = input.required<Array<string>>({alias: 'ifUserTeam'});

  hasView = false;

  private deepUtilService = inject(DeepUtilService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  ngOnInit() {
    const allowedTeams = this.allowedTeams();
    const userTeams = this.deepUtilService.getCurrentUserTeams();
    const isAdmin = this.deepUtilService.isAdminUser();
    const isAllowed = isAdmin || _intersection(allowedTeams, userTeams).length > 0;
    if (isAllowed && !this.hasView) {
      this.hasView = true;
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.hasView = false;
      this.viewContainer.clear();
    }
  }
}
