
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'toolbox',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './toolbox.component.html',
})
export class Toolbox {}
