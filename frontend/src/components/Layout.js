import Navbar from "./Navbar";
import Footer from "./Footer";
import FreelancerNavbar from "./FreelancerNavbar";
import FreelancerFooter from "./FreelancerFooter";

export default function Layout({ children, userType = "client" }) {
  return (
    <div className="flex flex-col min-h-screen">
      {userType === "freelancer" ? <FreelancerNavbar /> : <Navbar />}
      <main className="flex-1">{children}</main>
      {userType === "freelancer" ? <FreelancerFooter /> : <Footer />}
    </div>
  );
}