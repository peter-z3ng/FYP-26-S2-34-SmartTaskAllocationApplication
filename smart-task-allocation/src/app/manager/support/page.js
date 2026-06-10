import SideMenuLayout from "@/components/SideMenuLayout";
import SupportInquiryForm from "@/components/SupportInquiryForm";
import UserFeedbackForm from "@/components/UserFeedbackForm";

export default function ManagerSupportPage() {
  return (
    <SideMenuLayout actor="manager">
      <div className="space-y-6">
        <SupportInquiryForm />
        <UserFeedbackForm />
      </div>
    </SideMenuLayout>
  );
}
