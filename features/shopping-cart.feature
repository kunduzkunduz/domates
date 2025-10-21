@ecommerce @shopping @cart
Feature: Shopping Cart Management
  As a customer
  I want to manage items in my shopping cart
  So that I can purchase the products I want

  Background:
    Given the user is logged in
    And the product catalog is available
    And the shopping cart is empty

  @smoke @positive
  Scenario: Add item to cart
    Given the user is browsing the product catalog
    When they view the product "Wireless Headphones"
    And they click "Add to Cart"
    Then the item should be added to their cart
    And the cart count should show "1"
    And they should see a success message "Item added to cart"

  @cart @quantity
  Scenario: Update item quantity in cart
    Given the user has "Wireless Headphones" in their cart
    When they increase the quantity to "2"
    Then the cart should show quantity "2"
    And the total price should be updated
    And the subtotal should reflect the new quantity

  @cart @removal
  Scenario: Remove item from cart
    Given the user has "Wireless Headphones" in their cart
    When they click "Remove Item"
    Then the item should be removed from the cart
    And the cart should be empty
    And they should see a message "Item removed from cart"

  @cart @validation
  Scenario: Add item with insufficient stock
    Given the product "Limited Edition Watch" has only "1" item in stock
    When the user tries to add "2" items to cart
    Then they should see an error message "Insufficient stock"
    And only "1" item should be added to cart

  @cart @outline
  Scenario Outline: Cart calculations with different quantities
    Given the user has "<product>" in their cart
    When they update the quantity to "<quantity>"
    Then the subtotal should be "<subtotal>"
    And the tax should be "<tax>"
    And the total should be "<total>"

    Examples:
      | product           | quantity | subtotal | tax  | total |
      | Wireless Headphones | 1       | 99.99    | 8.00 | 107.99 |
      | Wireless Headphones | 2       | 199.98   | 16.00| 215.98 |
      | Smartphone        | 1       | 599.99   | 48.00| 647.99 |

  @cart @coupon
  Scenario: Apply discount coupon
    Given the user has items totaling "$100.00" in their cart
    When they apply coupon code "SAVE10"
    Then they should see a discount of "$10.00"
    And the total should be "$90.00"
    And they should see "Coupon applied successfully"

  @cart @checkout
  Scenario: Proceed to checkout
    Given the user has items in their cart
    When they click "Proceed to Checkout"
    Then they should be redirected to the checkout page
    And their cart items should be displayed
    And they should see shipping and payment options



