# Keep the provisional Clean Live Chat integration

Stream Pilot loads YouTube's popout chat without the YouTube API and applies local visual cleanup to hide unwanted page chrome while preserving a read-only chat experience. This deliberately accepts brittle DOM selectors and potential YouTube policy or distribution-review risk; the integration must retain YouTube attribution, collect no chat data, and be revisited or updated if YouTube changes the page or requires a compliant API-based approach.
