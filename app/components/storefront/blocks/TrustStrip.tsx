import TrustStripView from "../../TrustStrip";

// Byte-parity wrapper: renders the real trust/support strip exactly as the
// original homepage did. The strip's content is fixed in code (icons + support
// row); the block governs its presence, order and visibility on the page.
export default function TrustStrip() {
  return <TrustStripView />;
}
