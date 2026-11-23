import React from 'react';import RoutesApplication from './routes/RoutesApplication';import {FournisseurAuthentification} from './contextes/ContexteAuthentification';import {FournisseurTheme} from './contextes/ContexteTheme';
export default function App(){return <FournisseurTheme><FournisseurAuthentification><RoutesApplication/></FournisseurAuthentification></FournisseurTheme>}
