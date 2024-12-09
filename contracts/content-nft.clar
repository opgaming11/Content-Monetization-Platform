;; Content NFT Contract

(define-non-fungible-token content-nft uint)

(define-data-var last-token-id uint u0)

(define-map token-uris {token-id: uint} {uri: (string-utf8 256)})
(define-map token-creators {token-id: uint} {creator: principal})

(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

(define-read-only (get-token-uri (token-id uint))
  (ok (get uri (map-get? token-uris {token-id: token-id})))
)

(define-read-only (get-token-creator (token-id uint))
  (ok (get creator (map-get? token-creators {token-id: token-id})))
)

(define-public (mint (uri (string-utf8 256)))
  (let
    (
      (token-id (+ (var-get last-token-id) u1))
    )
    (try! (nft-mint? content-nft token-id tx-sender))
    (map-set token-uris {token-id: token-id} {uri: uri})
    (map-set token-creators {token-id: token-id} {creator: tx-sender})
    (var-set last-token-id token-id)
    (ok token-id)
  )
)

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) (err u403))
    (nft-transfer? content-nft token-id sender recipient)
  )
)

(define-public (burn (token-id uint))
  (let
    (
      (token-creator (unwrap! (get creator (map-get? token-creators {token-id: token-id})) (err u404)))
    )
    (asserts! (is-eq tx-sender token-creator) (err u403))
    (try! (nft-burn? content-nft token-id tx-sender))
    (map-delete token-uris {token-id: token-id})
    (map-delete token-creators {token-id: token-id})
    (ok true)
  )
)

