// MIT License
//
// Copyright (c) 2024 Elric Neumann (elricmann)
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

#pragma once

#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum {
  OPCODE_NOP = 0x00,
  OPCODE_CREATE_ELEMENT = 0x01,
  OPCODE_SET_ATTRIBUTE = 0x02,
  OPCODE_APPEND_CHILD = 0x03,
  OPCODE_REMOVE_CHILD = 0x04,
  OPCODE_REPLACE_CHILD = 0x05,
  OPCODE_TEXT_NODE = 0x06,
  OPCODE_SET_TEXT = 0x07,
  OPCODE_REMOVE_ATTRIBUTE = 0x08,
  OPCODE_STYLE = 0x09,
  OPCODE_EVENT_LISTENER = 0x0A,
  OPCODE_APPEND_SIBLING = 0x0B,
};

struct librender_bytecode_buffer {
  uint8_t* buffer;
  size_t size;
  size_t capacity;
  int is_locked;
};

struct librender_bytecode_buffer* librender_create_buffer(
    size_t initial_capacity) {
  if (initial_capacity == 0) {
    initial_capacity = 1024;
  }

  struct librender_bytecode_buffer* buf =
      (struct librender_bytecode_buffer*)malloc(
          sizeof(struct librender_bytecode_buffer));

  if (!buf) {
    fprintf(stderr, "Failed to allocate memory for buffer structure\n");
    exit(EXIT_FAILURE);
  }

  buf->buffer = (uint8_t*)malloc(initial_capacity * sizeof(uint8_t));

  if (!buf->buffer) {
    fprintf(stderr, "Failed to allocate memory for buffer data\n");
    free(buf);
    exit(EXIT_FAILURE);
  }

  buf->size = 0;
  buf->capacity = initial_capacity;
  buf->is_locked = 0;

  return buf;
}

void librender_free_buffer(struct librender_bytecode_buffer* buf) {
  if (!buf) {
    return;
  }

  if (buf->buffer) {
    free(buf->buffer);
  }

  free(buf);
}

void librender_lock_buffer(struct librender_bytecode_buffer* buf) {
  if (!buf) {
    return;
  }

  buf->is_locked = 1;
}

void librender_unlock_buffer(struct librender_bytecode_buffer* buf) {
  if (!buf) {
    return;
  }

  buf->is_locked = 0;
}

int librender_is_buffer_locked(const struct librender_bytecode_buffer* buf) {
  if (!buf) {
    return 0;
  }

  return buf->is_locked;
}

void librender_append_byte(struct librender_bytecode_buffer* buf,
                           uint8_t byte) {
  if (!buf || buf->is_locked) {
    return;
  }

  if (buf->size >= buf->capacity) {
    buf->capacity *= 2;
    buf->buffer =
        (uint8_t*)realloc(buf->buffer, buf->capacity * sizeof(uint8_t));
    if (!buf->buffer) {
      fprintf(stderr, "Failed to reallocate memory for buffer\n");
      exit(EXIT_FAILURE);
    }
  }

  buf->buffer[buf->size++] = byte;
}

void librender_append_bytes(struct librender_bytecode_buffer* buf,
                            const uint8_t* bytes, size_t count) {
  if (!buf || buf->is_locked || !bytes) {
    return;
  }

  for (size_t i = 0; i < count; i++) {
    librender_append_byte(buf, bytes[i]);
  }
}

void librender_create_element(struct librender_bytecode_buffer* buf,
                              const char* tag_name, uint8_t tag_length) {
  if (!buf || buf->is_locked || !tag_name || tag_length == 0) {
    return;
  }

  librender_append_byte(buf, OPCODE_CREATE_ELEMENT);
  librender_append_byte(buf, tag_length);
  librender_append_bytes(buf, (const uint8_t*)tag_name, tag_length);
}

void librender_set_attribute(struct librender_bytecode_buffer* buf,
                             const char* attr_name, uint8_t attr_name_length,
                             const char* attr_value,
                             uint8_t attr_value_length) {
  if (!buf || buf->is_locked || !attr_name || !attr_value ||
      attr_name_length == 0 || attr_value_length == 0) {
    return;
  }

  librender_append_byte(buf, OPCODE_SET_ATTRIBUTE);
  librender_append_byte(buf, attr_name_length);
  librender_append_bytes(buf, (const uint8_t*)attr_name, attr_name_length);
  librender_append_byte(buf, attr_value_length);
  librender_append_bytes(buf, (const uint8_t*)attr_value, attr_value_length);
}

void librender_append_child(struct librender_bytecode_buffer* buf) {
  if (!buf || buf->is_locked) {
    return;
  }

  librender_append_byte(buf, OPCODE_APPEND_CHILD);
}

void librender_append_sibling(struct librender_bytecode_buffer* buf) {
  if (!buf || buf->is_locked) {
    return;
  }

  librender_append_byte(buf, OPCODE_APPEND_SIBLING);
}

void librender_remove_child(struct librender_bytecode_buffer* buf) {
  if (!buf || buf->is_locked) {
    return;
  }

  librender_append_byte(buf, OPCODE_REMOVE_CHILD);
}

void librender_replace_child(struct librender_bytecode_buffer* buf) {
  if (!buf || buf->is_locked) {
    return;
  }

  librender_append_byte(buf, OPCODE_REPLACE_CHILD);
}

void librender_text_node(struct librender_bytecode_buffer* buf,
                         const char* text, uint8_t text_length) {
  if (!buf || buf->is_locked || !text || text_length == 0) {
    return;
  }

  librender_append_byte(buf, OPCODE_TEXT_NODE);
  librender_append_byte(buf, text_length);
  librender_append_bytes(buf, (const uint8_t*)text, text_length);
}

void librender_set_text(struct librender_bytecode_buffer* buf, const char* text,
                        uint8_t text_length) {
  if (!buf || buf->is_locked || !text || text_length == 0) {
    return;
  }

  librender_append_byte(buf, OPCODE_SET_TEXT);
  librender_append_byte(buf, text_length);
  librender_append_bytes(buf, (const uint8_t*)text, text_length);
}

void librender_remove_attribute(struct librender_bytecode_buffer* buf,
                                const char* attr_name,
                                uint8_t attr_name_length) {
  if (!buf || buf->is_locked || !attr_name || attr_name_length == 0) {
    return;
  }

  librender_append_byte(buf, OPCODE_REMOVE_ATTRIBUTE);
  librender_append_byte(buf, attr_name_length);
  librender_append_bytes(buf, (const uint8_t*)attr_name, attr_name_length);
}

void librender_set_style(struct librender_bytecode_buffer* buf,
                         const char* style_name, uint8_t style_name_length,
                         const char* style_value, uint8_t style_value_length) {
  if (!buf || buf->is_locked || !style_name || !style_value ||
      style_name_length == 0 || style_value_length == 0) {
    return;
  }

  librender_append_byte(buf, OPCODE_STYLE);
  librender_append_byte(buf, style_name_length);
  librender_append_bytes(buf, (const uint8_t*)style_name, style_name_length);
  librender_append_byte(buf, style_value_length);
  librender_append_bytes(buf, (const uint8_t*)style_value, style_value_length);
}

void librender_add_event_listener(struct librender_bytecode_buffer* buf,
                                  const char* event_type,
                                  uint8_t event_type_length) {
  if (!buf || buf->is_locked || !event_type || event_type_length == 0) {
    return;
  }

  librender_append_byte(buf, OPCODE_EVENT_LISTENER);
  librender_append_byte(buf, event_type_length);
  librender_append_bytes(buf, (const uint8_t*)event_type, event_type_length);
}

void librender_nop(struct librender_bytecode_buffer* buf) {
  if (!buf || buf->is_locked) {
    return;
  }

  librender_append_byte(buf, OPCODE_NOP);
}

void librender_output_bytecode(const struct librender_bytecode_buffer* buf,
                               const char* filename) {
  if (!buf || !filename) {
    return;
  }

  FILE* file = fopen(filename, "wb");

  if (!file) {
    fprintf(stderr, "Failed to open file %s for writing\n", filename);
    return;
  }

  fwrite(buf->buffer, 1, buf->size, file);
  fclose(file);
}

void librender_clear_buffer(struct librender_bytecode_buffer* buf) {
  if (!buf || buf->is_locked) {
    return;
  }

  buf->size = 0;
}

struct librender_bytecode_buffer* librender_merge_bytecode(
    struct librender_bytecode_buffer** buffers, size_t num_buffers) {
  if (!buffers || num_buffers == 0) {
    return NULL;
  }

  size_t total_size = 0;

  for (size_t i = 0; i < num_buffers; i++) {
    if (buffers[i]) {
      total_size += buffers[i]->size;
    }
  }

  struct librender_bytecode_buffer* merged_buffer =
      librender_create_buffer(total_size);

  if (!merged_buffer) {
    return NULL;
  }

  for (size_t i = 0; i < num_buffers; i++) {
    if (buffers[i]) {
      librender_append_bytes(merged_buffer, buffers[i]->buffer,
                             buffers[i]->size);
    }
  }

  return merged_buffer;
}

void librender_copy_buffer(struct librender_bytecode_buffer* dst,
                           const struct librender_bytecode_buffer* src) {
  if (!dst || !src || dst->is_locked || src->size == 0) {
    return;
  }

  librender_append_bytes(dst, src->buffer, src->size);
}

void librender_resize_buffer(struct librender_bytecode_buffer* buf,
                             size_t new_capacity) {
  if (!buf || buf->is_locked || new_capacity <= buf->capacity) {
    return;
  }

  buf->buffer = (uint8_t*)realloc(buf->buffer, new_capacity * sizeof(uint8_t));

  if (!buf->buffer) {
    fprintf(stderr, "Failed to reallocate buffer\n");
    exit(EXIT_FAILURE);
  }

  buf->capacity = new_capacity;
}

void librender_append_bytecode(struct librender_bytecode_buffer* buf,
                               const uint8_t* bytecode, size_t bytecode_size) {
  if (!buf || buf->is_locked || !bytecode || bytecode_size == 0) {
    return;
  }

  librender_append_bytes(buf, bytecode, bytecode_size);
}

void librender_insert_byte(struct librender_bytecode_buffer* buf, size_t index,
                           uint8_t byte) {
  if (!buf || buf->is_locked || index > buf->size) {
    return;
  }

  if (buf->size >= buf->capacity) {
    buf->capacity *= 2;
    buf->buffer =
        (uint8_t*)realloc(buf->buffer, buf->capacity * sizeof(uint8_t));

    if (!buf->buffer) {
      fprintf(stderr, "Failed to reallocate buffer during insertion\n");
      exit(EXIT_FAILURE);
    }
  }

  for (size_t i = buf->size; i > index; i--) {
    buf->buffer[i] = buf->buffer[i - 1];
  }

  buf->buffer[index] = byte;
  buf->size++;
}

void librender_remove_byte(struct librender_bytecode_buffer* buf,
                           size_t index) {
  if (!buf || buf->is_locked || index >= buf->size) {
    return;
  }

  for (size_t i = index; i < buf->size - 1; i++) {
    buf->buffer[i] = buf->buffer[i + 1];
  }

  buf->size--;
}

void librender_get_byte(const struct librender_bytecode_buffer* buf,
                        size_t index, uint8_t* out_byte) {
  if (!buf || !out_byte || index >= buf->size) {
    return;
  }

  *out_byte = buf->buffer[index];
}

struct librender_bytecode_buffer* librender_clone_buffer(
    const struct librender_bytecode_buffer* src) {
  if (!src || src->size == 0) {
    return NULL;
  }

  struct librender_bytecode_buffer* clone =
      librender_create_buffer(src->capacity);

  if (!clone) {
    return NULL;
  }

  librender_append_bytes(clone, src->buffer, src->size);

  return clone;
}

void librender_destroy_bytecode(struct librender_bytecode_buffer* buf) {
  if (!buf) {
    return;
  }

  librender_free_buffer(buf);
}
