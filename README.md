----Inventory Management System – Frontend (Angular)----

This is the frontend part of the Full Stack Inventory Management System.
It provides a responsive UI to interact with the backend APIs for managing products, stock, and orders.

--->Technology Stack

Frontend: Angular, TypeScript, HTML, CSS
Styling: Bootstrap / CSS3
Communication: REST API calls to backend

--->Backend Repository

The backend of this project is built using Spring Boot, Java, MySQL:
[Inventory Management System – Backend](https://github.com/preethi-fullstack/ims-backend)

--->Features

Responsive and user-friendly interface
View, add, update, and delete products
Track stock levels
Process orders
Communicates with backend REST APIs

--->Project Structure

ims-frontend/
├─ src/app
│ ├─ components → UI components
│ ├─ services → API service calls
│ ├─ models → TypeScript data models
│ └─ app.module.ts → Angular module configuration
├─ src/assets → Images and static files
├─ src/index.html → Main HTML file
└─ angular.json → Angular configuration

--->How to Run

Clone the repo: git clone https://github.com/preethi-fullstack/ims-frontend.git
Navigate to the project folder in VS Code or terminal
Install dependencies: npm install
Run the frontend server: ng serve
Open browser at http://localhost:4200/

--->Contribution


This repo is mainly for demonstration as part of my full stack project.
Frontend communicates with the backend via REST API to manage inventory data.
