export class ReservationNotFoundError extends Error {
  constructor(message = "Reservation not found") {
    super(message);
    this.name = "ReservationNotFoundError";
  }
}

export class MemberNotFoundError extends Error {
  constructor(message = "Member not found") {
    super(message);
    this.name = "MemberNotFoundError";
  }
}

export class MemberEmailConflictError extends Error {
  constructor(email: string) {
    super(`A member with email "${email}" already exists`);
    this.name = "MemberEmailConflictError";
  }
}

export class ProposalNotFoundError extends Error {
  constructor(message = "Proposal not found") {
    super(message);
    this.name = "ProposalNotFoundError";
  }
}

export class InvalidProposalTransitionError extends Error {
  constructor(current: string, target: string) {
    super(`Cannot transition proposal from "${current}" to "${target}"`);
    this.name = "InvalidProposalTransitionError";
  }
}

export class ProposalLockedError extends Error {
  constructor(message = "Proposal is locked and cannot be modified") {
    super(message);
    this.name = "ProposalLockedError";
  }
}
