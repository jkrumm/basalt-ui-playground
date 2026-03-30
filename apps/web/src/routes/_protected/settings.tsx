import { Button, Callout, Card, Elevation, H2, Spinner } from "@blueprintjs/core";
import { Flex } from "@blueprintjs/labs";
import { PatchUserPreferencesSchema } from "@cbbi/schemas";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { Suspense, useEffect } from "react";
import { sortByAtom, viewModeAtom } from "~/atoms";
import { PageLayout } from "~/components/layout/PageLayout";
import { useAppForm } from "~/lib/form";
import { zodFormValidator } from "~/lib/validation";
import { updatePreferencesMutation, userPreferencesQuery } from "~/queries/preferences.queries";

export const Route = createFileRoute("/_protected/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <PageLayout>
      <Suspense
        fallback={
          <Flex justifyContent="center" style={{ padding: 40 }}>
            <Spinner />
          </Flex>
        }
      >
        <SettingsForm />
      </Suspense>
    </PageLayout>
  );
}

function SettingsForm() {
  const { data: serverPrefs } = useSuspenseQuery(userPreferencesQuery());
  const qc = useQueryClient();

  const setViewMode = useSetAtom(viewModeAtom);
  const setSortBy = useSetAtom(sortByAtom);

  // Server-authoritative override: sync localStorage atoms with server preferences
  // whenever this page mounts. Ensures local state converges with the server after
  // login or after a change made in another session.
  //
  // Design decision: override is scoped to the settings page visit, not triggered
  // globally on login. Moving it to a global auth observer is a future improvement.
  useEffect(() => {
    setViewMode(serverPrefs.viewMode);
    setSortBy(serverPrefs.sortBy);
  }, [serverPrefs, setViewMode, setSortBy]);

  const mutation = useMutation({
    ...updatePreferencesMutation(),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["user", "preferences"] });
      // Eagerly update atoms so the home page reflects the saved values immediately
      setViewMode(data.viewMode);
      setSortBy(data.sortBy);
    },
  });

  const form = useAppForm({
    defaultValues: serverPrefs,
    validators: { onChange: zodFormValidator(PatchUserPreferencesSchema) },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "2rem 1rem" }}>
      <H2 style={{ marginTop: 0, marginBottom: 24 }}>Preferences</H2>
      <Card elevation={Elevation.ONE}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.AppField name="theme">
            {(field) => (
              <field.SelectField
                label="Theme"
                options={[
                  { value: "system", label: "System" },
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
              />
            )}
          </form.AppField>
          <form.AppField name="viewMode">
            {(field) => (
              <field.SelectField
                label="View mode"
                options={[
                  { value: "grid", label: "Grid" },
                  { value: "table", label: "Table" },
                ]}
              />
            )}
          </form.AppField>
          <form.AppField name="sortBy">
            {(field) => (
              <field.SelectField
                label="Sort order"
                options={[
                  { value: "default", label: "Default order" },
                  { value: "value-asc", label: "Value: Low → High" },
                  { value: "value-desc", label: "Value: High → Low" },
                  { value: "name-asc", label: "Name: A → Z" },
                ]}
              />
            )}
          </form.AppField>
          {mutation.isSuccess && (
            <Callout intent="success" style={{ marginBottom: 16 }}>
              Preferences saved.
            </Callout>
          )}
          {mutation.isError && (
            <Callout intent="danger" style={{ marginBottom: 16 }}>
              {mutation.error instanceof Error ? mutation.error.message : "Save failed."}
            </Callout>
          )}
          <form.Subscribe selector={(state) => ({ isSubmitting: state.isSubmitting })}>
            {({ isSubmitting }) => (
              <Button
                type="submit"
                intent="primary"
                text="Save preferences"
                loading={isSubmitting}
                fill
              />
            )}
          </form.Subscribe>
        </form>
      </Card>
      <p style={{ marginTop: 12, color: "#8f99a8", fontSize: 13 }}>
        Theme selection saves to your account. For a live preview, use the theme toggle in the nav.
      </p>
    </div>
  );
}
