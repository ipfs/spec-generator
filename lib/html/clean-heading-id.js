
// Something in remark prefixes remark-heading-id identifiers with `user-content-` and it's unclear what,
// even in basic tests. This cleans it up, but it would be better to spend the time to find the source.

export default function run (doc) {
  const headings = doc.querySelectorAll(
    `section :is(h2, h3, h4, h5, h6)[id^="user-content-"]`
  );
  for (const h of headings) {
    h.id = h.id.replace('user-content-', '');
  }
}
