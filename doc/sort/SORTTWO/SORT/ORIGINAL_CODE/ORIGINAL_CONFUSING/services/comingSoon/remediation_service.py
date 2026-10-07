def apply_remediation(remediation):

    print(f"\nRemediation available: {remediation.name}")
    print(remediation.description)

    # MVP: always yes
    response = "yes"

    if response == "yes":

        print("\nApplying remediation...")

        result = remediation.execute()

        print(result.message)

        print("\nVerifying remediation...")

        verification = remediation.verify()

        print(verification.message)

        if verification.success:
            print("Remediation successful")
        else:
            print("Remediation failed")
            print("Consider running rollback.")

    else:
        print("Remediation skipped.")


ask_to_apply = apply_remediation
