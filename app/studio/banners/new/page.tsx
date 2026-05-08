import Link from "next/link";
import PageHead from "../../components/PageHead";
import BannerForm from "../[id]/BannerForm";

export const metadata = { title: "New banner · Studio" };

export default function NewBannerPage() {
  return (
    <div className="stu-page">
      <PageHead title="New banner" sub="Upload an image, write the words customers will see, and pick when it goes live."
                back={{ href: "/studio/banners", label: "Back to banners" }}>
        <Link href="/studio/banners" className="stu-btn stu-btn--ghost">Cancel</Link>
      </PageHead>
      <BannerForm />
    </div>
  );
}
