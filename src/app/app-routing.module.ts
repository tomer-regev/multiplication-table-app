import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { GameComponent } from "./game.component"; // Import GameComponent

const routes: Routes = [
  { path: "", component: GameComponent }, // Add a route for your game component
  // You can add more routes here for other components if needed
];

@NgModule({
  imports: [RouterModule.forRoot(routes)], // Use forRoot to configure the routes
  exports: [RouterModule],
})
export class AppRoutingModule {}
