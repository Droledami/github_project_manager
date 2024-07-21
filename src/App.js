import {createBrowserRouter, RouterProvider} from "react-router-dom";
import LoginPage, {loader as loginPageLoader} from "./Pages/LoginPage";
import {MembersProvider, UserProvider} from "./customHooks";
import ProjectsPage, {loader as projectsPageLoader} from "./Pages/ProjectsPage";
import CreateProjectPage, {
    loader as createProjectPageLoader,
    action as createProjectPageAction
} from "./Pages/CreateProjectPage";
import CreateRepositoryPage, {
    loader as createRepositoryLoader,
} from "./Pages/CreateRepositoryPage";
import RepositoriesPage, {loader as repositoriesPageLoader} from "./Pages/RepositoriesPage";

const router = createBrowserRouter(
    [
        {
            path: "/login",
            element: <LoginPage/>,
            loader: loginPageLoader
        },
        {
            path: "/",
            element: <ProjectsPage/>,
            loader: projectsPageLoader
        },
        {
            path: "/project/new",
            element: <CreateProjectPage/>,
            loader: createProjectPageLoader,
            action: createProjectPageAction
        },
        {
            path: "/project/:id",
            element: <CreateProjectPage/>,
            loader: createProjectPageLoader,
            action: createProjectPageAction
        },
        {
            path: "/repository/:url",
            element: <CreateRepositoryPage/>,
            loader: createRepositoryLoader,
        },
        {
            path: "/repositories/:id",
            element: <RepositoriesPage/>,
            loader: repositoriesPageLoader,
        },
    ]
);

function App() {
    return (
        <UserProvider>
            <MembersProvider>
                <RouterProvider router={router}>
                </RouterProvider>
            </MembersProvider>
        </UserProvider>
    );
}

export default App;
