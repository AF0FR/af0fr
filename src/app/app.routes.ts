import { Routes } from '@angular/router';
import { LogbookDataService } from './pages/af0fr_logbook/services/logbook-data.service';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/af0fr/af0fr.page').then(module => module.Af0frPage),
    },
    {
        path: 'net-control',
        loadComponent: () => import('./pages/af0fr_net_control/af0fr_net_control.page').then(module => module.Af0frNetControlPage),
    },
    {
        path: 'qsl-card',
        loadComponent: () => import('./pages/card_demo/card_demo.page').then(module => module.CardDemoPage),
    },
    {
        path: 'cw',
        loadComponent: () => import('./pages/cw/af0fr_cw_qso.page').then(module => module.Af0frCwQsoPage),
    },
    {
        path: 'signal',
        loadComponent: () => import('./pages/azimuth-map/af0fr_azimuth_map.page').then(module => module.Af0frAzimuthMapPage),
    },
    {
        path: 'logbook',
        providers: [LogbookDataService],
        loadComponent: () => import('./pages/af0fr_logbook/af0fr_logbook.page').then(module => module.Af0frLogbookPage),
    },

    // Transitional aliases for links and bookmarks from iftaylor.com/AF0FR.
    { path: 'af0fr', redirectTo: '', pathMatch: 'full' },
    { path: 'af0fr/net_control', redirectTo: 'net-control', pathMatch: 'full' },
    { path: 'af0fr/card_demo', redirectTo: 'qsl-card', pathMatch: 'full' },
    { path: 'af0fr/cw_qso', redirectTo: 'cw', pathMatch: 'full' },
    { path: 'af0fr/signal', redirectTo: 'signal', pathMatch: 'full' },
    { path: 'af0fr/logbook', redirectTo: 'logbook', pathMatch: 'full' },
    { path: 'AF0FR', redirectTo: '', pathMatch: 'full' },
    { path: 'AF0FR/net_control', redirectTo: 'net-control', pathMatch: 'full' },
    { path: 'AF0FR/card_demo', redirectTo: 'qsl-card', pathMatch: 'full' },
    { path: 'AF0FR/cw_qso', redirectTo: 'cw', pathMatch: 'full' },
    { path: 'AF0FR/signal', redirectTo: 'signal', pathMatch: 'full' },
    { path: 'AF0FR/logbook', redirectTo: 'logbook', pathMatch: 'full' },
    { path: '**', redirectTo: '' },
];
