export interface ApprovedLink {
  href: string
  /** Key in the `capstone` namespace for the link text. */
  labelKey: string
}

/** Empty and hidden until the partner approves branding and material; never redirects automatically. */
export const approvedEducationalLinks: readonly ApprovedLink[] = []
