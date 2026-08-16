import { auth } from "@clerk/nextjs/server";

const MainLayout = async ({ children }) => {
  await auth.protect(); // redirects to sign-in automatically
  return <div className="container mx-auto my-32">{children}</div>;
};

export default MainLayout;
