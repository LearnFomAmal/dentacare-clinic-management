import { Routes, Route } from 'react-router-dom';

function AppRoutes() {
    return (
        <Routes>

            <Route path="/" element={

                 <div className="flex min-h-screen items-center justify-center">
            <h1 className="text-4xl font-extrabold">
              DentaCare Frontend Started 🚀
            </h1>
          </div>
             }
             />
        </Routes>
    )
}

export default AppRoutes;
