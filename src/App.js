import {createBrowserRouter, RouterProvider} from "react-router-dom";
import LoginPage, {loader as loginPageLoader}from "./Pages/LoginPage";
import {UserProvider} from "./customHooks";
import ProjectsPage, {loader as projectsPageLoader}from "./Pages/ProjectsPage";
import CreateProjectPage, {loader as createProjectPageLoader, action as createProjectPageAction} from "./Pages/CreateProjectPage";

const router = createBrowserRouter(
    [
        {
            path:"/login",
            element: <LoginPage/>,
            loader: loginPageLoader
        },
        {
            path:"/",
            element: <ProjectsPage/>,
            loader: projectsPageLoader
        },
        {
            path:"/project/new",
            element: <CreateProjectPage/>,
            loader: createProjectPageLoader,
            action: createProjectPageAction
        },
        {
            path:"/project/:id",
            element: <CreateProjectPage/>,
            loader: createProjectPageLoader,
            action: createProjectPageAction
        },
        {
            path:"/repo/:urlId"
        },
    ]
);

function App() {
    return (
        <UserProvider>
            <RouterProvider router={router}>
            </RouterProvider>
        </UserProvider>
    );
}

export default App;
