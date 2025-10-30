Feature: Lead and Profile Creation Based on Triggered Events and Package Purchase Status

  # Event trigger examples:
  # - Contact Information Verified
  # - Package Detail Page Visited
  # - Student Visited Checkout Page


  Scenario: Case 1 (Guest) – No active package, no existing lead
    Given the customer is a guest (not authenticated)
    And the user triggers the event: Contact Information Verified
    And a separate task is scheduled 1 hour later for the event
    And there is no existing lead for the customer's phone number
    And the user does not have an active package before the first task time arrives
    When the first task time arrives 
    Then the first task is run
    And a new lead is created for the customer's phone number

  Scenario: Case 1 (Auth) – No active package, no existing lead
    Given the customer is authenticated
    And the user triggers one or more of these events: Package Detail Page Visited, Student Visited Checkout Page
    And a separate task is scheduled 1 hour later for each event
    And there is no existing lead for the customer's phone number
    And the user does not have an active package before the first task time arrives
    When the first task time arrives 
    Then the first task is run
    And a new lead is created for the customer's phone number

  Scenario: Case 2 (Guest) – No active package, lead already exists
    Given the customer is a guest (not authenticated)
    And the user triggers the event: Contact Information Verified
    And a separate task is scheduled 1 hour later for the event
    And there is already a lead for the customer's phone number
    And the user does not have an active package before the task time arrives
    When the task time arrives 
    Then the task is run
    And a profile is created under the existing lead for the customer's phone number

  Scenario: Case 2 (Auth) – No active package, lead already exists
    Given the customer is authenticated
    And the user triggers one or more of these events: Package Detail Page Visited, Student Visited Checkout Page
    And a separate task is scheduled 1 hour later for each event
    And there is already a lead for the customer's phone number
    And the user does not have an active package before the task time arrives
    When the task time arrives 
    Then the task is run
    And a profile is created under the existing lead for the customer's phone number

  Scenario: Case 3 (Guest) – Has active package
    Given the customer is a guest (not authenticated)
    And the user triggers the event: Contact Information Verified
    And a separate task is scheduled 1 hour later for the event
    And the user has an active package before the task time arrives
    When the task time arrives
    Then the task is canceled
    And no lead or profile is created for the customer's phone number

  Scenario: Case 3 (Auth) – Has active package
    Given the customer is authenticated
    And the user triggers one or more of these events: Package Detail Page Visited, Student Visited Checkout Page
    And a separate task is scheduled 1 hour later for each event
    And the user has an active package before the task time arrives
    When the task time arrives
    Then the task is canceled
    And no lead or profile is created for the customer's phone number

