;; Subscription Contract

(define-map subscriptions
  { subscriber: principal, creator: principal }
  { start-block: uint, end-block: uint, amount: uint }
)

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u403))
(define-constant ERR_INVALID_SUBSCRIPTION (err u404))

(define-public (create-subscription (creator principal) (duration uint) (amount uint))
  (let
    (
      (start-block block-height)
      (end-block (+ block-height duration))
    )
    (map-set subscriptions
      { subscriber: tx-sender, creator: creator }
      { start-block: start-block, end-block: end-block, amount: amount }
    )
    (try! (stx-transfer? amount tx-sender creator))
    (ok true)
  )
)

(define-public (renew-subscription (creator principal))
  (let
    (
      (subscription (unwrap! (map-get? subscriptions { subscriber: tx-sender, creator: creator }) ERR_INVALID_SUBSCRIPTION))
      (duration (- (get end-block subscription) (get start-block subscription)))
      (amount (get amount subscription))
      (new-start-block (get end-block subscription))
      (new-end-block (+ new-start-block duration))
    )
    (map-set subscriptions
      { subscriber: tx-sender, creator: creator }
      { start-block: new-start-block, end-block: new-end-block, amount: amount }
    )
    (try! (stx-transfer? amount tx-sender creator))
    (ok true)
  )
)

(define-public (cancel-subscription (creator principal))
  (begin
    (map-delete subscriptions { subscriber: tx-sender, creator: creator })
    (ok true)
  )
)

(define-read-only (get-subscription (subscriber principal) (creator principal))
  (map-get? subscriptions { subscriber: subscriber, creator: creator })
)

(define-read-only (is-subscribed (subscriber principal) (creator principal))
  (match (map-get? subscriptions { subscriber: subscriber, creator: creator })
    subscription (>= (get end-block subscription) block-height)
    false
  )
)

