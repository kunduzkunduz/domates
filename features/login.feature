@login @authentication
Feature: User Login
  As a user
  I want to be able to log in to the application
  So that I can access my account and use the features

  Background:
    Given the application is running
    And the login page is accessible

  @smoke @positive
  Scenario: Successful login with valid credentials
    Given the user is on the login page
    When they enter valid email "user@example.com"
    And they enter valid password "password123"
    And they click the login button
    Then they should be redirected to the dashboard
    And they should see a welcome message
    And their session should be active

  @negative @validation
  Scenario: Failed login with invalid credentials
    Given the user is on the login page
    When they enter invalid email "invalid@example.com"
    And they enter invalid password "wrongpassword"
    And they click the login button
    Then they should see an error message "Invalid credentials"
    And they should remain on the login page
    And their session should not be active

  @validation @email
  Scenario: Login validation with empty fields
    Given the user is on the login page
    When they leave the email field empty
    And they leave the password field empty
    And they click the login button
    Then they should see validation errors
    And the email field should show "Email is required"
    And the password field should show "Password is required"

  @security @rate-limiting
  Scenario: Login attempt rate limiting
    Given the user is on the login page
    When they attempt to login 5 times with invalid credentials
    Then they should see a rate limiting message
    And they should be temporarily blocked from login attempts
    And they should see a countdown timer

  @password-reset @forgot-password
  Scenario: Password reset flow
    Given the user is on the login page
    When they click the "Forgot Password" link
    Then they should be redirected to the password reset page
    When they enter their email address "user@example.com"
    And they click the "Send Reset Link" button
    Then they should see a confirmation message
    And they should receive a password reset email



